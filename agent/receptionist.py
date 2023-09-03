from langchain.tools import StructuredTool
from langchain import OpenAI
from langchain.agents import initialize_agent, AgentType, load_tools
# from langchain.memory import ConversationBufferMemory
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema.agent import AgentAction, AgentFinish
from langchain.callbacks.manager import CallbackManager
from langchain.chains import ConversationalRetrievalChain
from langchain.document_loaders.generic import GenericLoader
from langchain.document_loaders.parsers import LanguageParser
from langchain.text_splitter import Language
from git import Repo
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from loguru import logger
import os
from utils.common import PROJECT_ROOT
from langchain.llms import LlamaCpp
from langchain import PromptTemplate, LLMChain
from langchain.callbacks.manager import CallbackManager
from langchain.memory import ConversationSummaryMemory
from langchain.chains import ConversationalRetrievalChain 
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from utils import config 
from langchain.chains.question_answering import load_qa_chain

def multiplier(a: float, b: float) -> float:
    """Multiply the provided floats."""
    return a * b

# tool = StructuredTool.from_function(multiplier)
#tools = load_tools(["serpapi", "llm-math"], llm=llm)
#tools[0].name = "Google Search"


class MyCustomHandler(BaseCallbackHandler):
    def __init__(self, publish):
        super().__init__()
        self.publish = publish

    def on_agent_action(self, action: AgentAction, **kwargs) -> None:
        self.publish("agent is using " + action.tool)

    def on_agent_finish(self, finish: AgentFinish, **kwargs) -> None:
        self.publish("agent is finished ")

# Prompt
template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer. 
Use three sentences maximum and keep the answer as concise as possible. 
{context}
Question: {question}
Helpful Answer:"""
QA_CHAIN_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template=template,
)

class Receptionist:
    def __init__(self, 
                 documentation_url="https://github.com/hwchase17/langchain", 
                 local_directory=PROJECT_ROOT / "tmp/test_repo",
                 default_branch='master',
                 repo_name = "langchain"):
        self.repo_name = repo_name
        # self.agent = initialize_agent(
        #     # [tool],
        #     tools,
        #     llm,
        #     agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        #     verbose=True,
        #     callback_manager=CallbackManager([MyCustomHandler(publish)])
        # )
        self.chat_history = []
        if not os.path.exists(local_directory):
            Repo.clone_from(documentation_url, local_directory,  branch=default_branch,
                            # progress=CloneProgress()
                            )

        loader = GenericLoader.from_filesystem(
            local_directory / "libs/langchain/langchain",
            glob="**/*",
            suffixes=[".py"],
            parser=LanguageParser(language=Language.PYTHON,
                                  parser_threshold=500)
        )
        code_files = loader.load()
        logger.info({"length of document": len(code_files)})

        python_splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.PYTHON, chunk_size=2000, chunk_overlap=200)
        code_files = python_splitter.split_documents(code_files)
        logger.info({"length of document after split": len(code_files)})
        code_files = code_files[:300]
        logger.info("Only keep first 300 for debugging")

        documentation_loader = GenericLoader.from_filesystem(
            PROJECT_ROOT / "tmp/text/python.langchain.com",
            glob="**/*",
            suffixes=[".txt"],
            parser=LanguageParser(
                                  parser_threshold=500)
        )
        documentation = documentation_loader.load()
        logger.info({"length of document": len(documentation)})

        documentation_splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.MARKDOWN, chunk_size=2000, chunk_overlap=200)
        documentation = documentation_splitter.split_documents(documentation)
        logger.info({"length of document after split": len(documentation)})
        documentation = documentation[:300]
        logger.info("Only keep first 300 for debugging")


        embeddings = OpenAIEmbeddings(disallowed_special=())
        persist_directory = PROJECT_ROOT / 'db'
        db = Chroma.from_documents(code_files + documentation, embeddings, persist_directory=str(persist_directory))
        self.retriever = db.as_retriever(
            search_type="mmr",  # You can also experiment with "similarity"
            search_kwargs={"k": 8},
        )
        db.persist()

        callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
        #memory = ConversationSummaryMemory(llm=llm,memory_key="chat_history",return_messages=True)
        if config.CONFIG.openai_api_model:
            llm = OpenAI(temperature=0)
        else:
            print(PROJECT_ROOT / "models/code-llama/codellama-7b.Q4_K_M.gguf")
            llm = LlamaCpp(
                model_path=str(PROJECT_ROOT / "models/code-llama/codellama-7b.Q4_K_M.gguf"),
                n_ctx=5000,
                n_gpu_layers=1,
                n_batch=512,
                f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls
                callback_manager=callback_manager,
                verbose=True,
            )
        
        # Chain
        self.chain = load_qa_chain(llm, chain_type="stuff", prompt=QA_CHAIN_PROMPT)

        #self.qa = ConversationalRetrievalChain.from_llm(
        #    llm, retriever=self.retriever, memory = memory)

    def run(self, query):

        # Docs
        docs = self.retriever.get_relevant_documents(query)
        logger.info(docs)
        # Run
        result = self.chain({"input_documents": docs, "question": query}, return_only_outputs=True)
        #result = self.qa(
        #    {"question": query, "chat_history": self.chat_history})
        #self.chat_history.append((query, result["answer"]))
        logger.info(result)
        logger.info(result['output_text'])

        return result["output_text"]
