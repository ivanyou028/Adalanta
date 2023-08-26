from langchain.tools import StructuredTool
from langchain import OpenAI
from langchain.agents import initialize_agent, AgentType, load_tools
# from langchain.memory import ConversationBufferMemory
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema.agent import AgentAction, AgentFinish
from langchain.callbacks.manager import CallbackManager

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
    def __init__(self, publish):
        self.publish = publish
        self.agent = initialize_agent(
            # [tool],
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            callback_manager=CallbackManager([MyCustomHandler(publish)])
        )
    
    def run(self, query):
        ans = self.agent.run(query)
        self.publish(ans)
        return ans