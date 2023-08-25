from langchain.tools import StructuredTool
from langchain import OpenAI
from langchain.agents import initialize_agent, AgentType
# from langchain.memory import ConversationBufferMemory

llm = OpenAI(temperature=0)

def multiplier(a: float, b: float) -> float:
    """Multiply the provided floats."""
    return a * b


tool = StructuredTool.from_function(multiplier)

Receptionist = agent_executor = initialize_agent(
    [tool],
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

# agent_executor.run("What is 3 times 4")