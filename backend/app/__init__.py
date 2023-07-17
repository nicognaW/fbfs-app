import asyncio

import langchain

from .char_ask import *
from .fishbiggerfishsmaller import *

__all__ = ["ask", "ask_stream", "fbfs", "fbfs_stream"]

langchain.debug = True


async def main():
    print(await ask("What is the best thing that ever happend in 2023?"))


if __name__ == "__main__":
    asyncio.run(main())
