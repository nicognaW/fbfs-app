from langchain import SerpAPIWrapper
from langchain.agents import load_tools, initialize_agent, AgentType
from langchain.callbacks.manager import CallbackManager
from langchain.chat_models import ChatOpenAI
from langchain.prompts import SystemMessagePromptTemplate
from langchain.schema import SystemMessage
from langchain.tools import Tool
from lcserve import serving

PROMPT_SUFFIX = ("Begin! Remember to speak as {} when giving your final answer. Use lots of \"Args\"\n"
                 "\n"
                 "Question: {{input}}\n"
                 "{{agent_scratchpad}}")
PROMPT_PREFIX = ("Answer the following questions as best you can, but speaking as {} might speak."
                 "You have access to the some tools by calling the functions, if you think you have to call some "
                 "function, just call, don't ask for confirm.")
WebSearchDescription = ("Do a web search, useful for when you need to answer questions about current events or "
                        "anything that you don't have enough information for sure to answer and need to do a web "
                        "search.")
TEMPERATURE = 0.45
MODEL_NAME = "gpt-3.5-turbo-0613"
DEFAULT_CHARACTER = "Rick Sanchez"


def initialize_tools(llm):
    search = SerpAPIWrapper()
    tools = load_tools([], llm=llm)
    tools.append(Tool(name="WebSearch", func=search.run, description=WebSearchDescription))
    return tools


@serving(websocket=False)
async def ask(question: str) -> str:
    llm = ChatOpenAI(temperature=TEMPERATURE, model=MODEL_NAME)
    tools = initialize_tools(llm)
    prefix = PROMPT_PREFIX.format(DEFAULT_CHARACTER)
    suffix = PROMPT_SUFFIX.format(DEFAULT_CHARACTER)
    agent_executor = initialize_agent(tools,
                                      llm=llm,
                                      agent=AgentType.OPENAI_MULTI_FUNCTIONS,
                                      agent_kwargs={
                                          "system_message": SystemMessage(content=prefix),
                                          "extra_prompt_messages": [SystemMessagePromptTemplate.from_template(suffix)]
                                      },
                                      verbose=True)
    return agent_executor.run(question)


@serving(websocket=True)
async def ask_stream(question: str, **kwargs) -> str:
    streaming_handler = kwargs.get('streaming_handler')
    llm = ChatOpenAI(temperature=TEMPERATURE, model=MODEL_NAME, streaming=True,
                     callback_manager=CallbackManager([streaming_handler]))
    tools = initialize_tools(llm)
    prefix = PROMPT_PREFIX.format(DEFAULT_CHARACTER)
    suffix = PROMPT_SUFFIX.format(DEFAULT_CHARACTER)
    agent_executor = initialize_agent(tools,
                                      llm=llm,
                                      agent=AgentType.OPENAI_MULTI_FUNCTIONS,
                                      agent_kwargs={
                                          "system_message": SystemMessage(content=prefix),
                                          "extra_prompt_messages": [SystemMessagePromptTemplate.from_template(suffix)]
                                      },
                                      verbose=True)
    return agent_executor.run(question)
