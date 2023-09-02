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

llm = OpenAI(temperature=0)


def multiplier(a: float, b: float) -> float:
    """Multiply the provided floats."""
    return a * b

# tool = StructuredTool.from_function(multiplier)


tools = load_tools(["serpapi", "llm-math"], llm=llm)
tools[0].name = "Google Search"


class MyCustomHandler(BaseCallbackHandler):
    def __init__(self, publish):
        super().__init__()
        self.publish = publish

    def on_agent_action(self, action: AgentAction, **kwargs) -> None:
        self.publish("agent is using " + action.tool)

    def on_agent_finish(self, finish: AgentFinish, **kwargs) -> None:
        self.publish("agent is finished ")


class Receptionist:
    def __init__(self, publish, 
                 documentation_url="https://github.com/hwchase17/langchain", 
                 local_directory="/Users/leon/workdir/Adalanta/tmp/test_repo",
                 default_branch='master',
                 repo_name = "langchain"):
        self.publish = publish
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
            local_directory+"/libs/langchain/langchain",
            glob="**/*",
            suffixes=[".py"],
            parser=LanguageParser(language=Language.PYTHON,
                                  parser_threshold=100)
        )
        documents = loader.load()
        logger.info({"length of document": len(documents)})

        python_splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.PYTHON, chunk_size=2000, chunk_overlap=200)
        texts = python_splitter.split_documents(documents)
        logger.info({"length of document after split": len(texts)})
        texts = texts[:100]
        logger.info("Only keep first 100 for debugging")

        embeddings = OpenAIEmbeddings(disallowed_special=())
        db = Chroma.from_documents(texts, embeddings)
        self.retriever = db.as_retriever(
            search_type="mmr",  # You can also experiment with "similarity"
            search_kwargs={"k": 8},
        )
        self.qa = ConversationalRetrievalChain.from_llm(
            llm, retriever=self.retriever)

    def run(self, query):
        result = self.qa(
            {"question": query, "chat_history": self.chat_history})
        self.chat_history.append((query, result["answer"]))
        logger.info(result["answer"])

        self.publish(result["answer"])
        return "Ask me more about" + self.repo_name
