# Ways of running LLM Chain

In the [root Chains doc page](https://python.langchain.com/docs/modules/chains/), it tells you that if you have multiple
LLMChain input variables, you call it like

```python
chain.run({
    'company': "ABC Startup",
    'product': "colorful socks"
})
```

Alright, you pass parameters to a function using `dict`, it's not so cool but also not that dump since it's how `kwargs`
works, and in
the [introduction of LLMChain](https://python.langchain.com/docs/modules/chains/foundational/llm_chain#additional-ways-of-running-llm-chain),
you find that there's multiple ways of running a LLMChain with different functions that langchain has already
implemented for you, seems fair, just something like `apply`, `run`, etc. in kotlin, altough this is not a programming
language but just some library to call, it's all fair.

And someday you might want to build an async function, and you look
at [Async API](https://python.langchain.com/docs/modules/chains/how_to/async_chain).

OK, cool, turned out you can call some of the chains asynchronously and some not, not to mention how suck is that if you
don't know exactly which one could be async or which one couldn't if you don't look up at their source codes.
Wait a minute, what is this?

```python
resp = chain.run(product="toothpaste")
```

I'm sorry sir I thought that
> `predict` is similar to `run` method except that the input keys are specified as keyword arguments instead of a Python
> dict.

(
from [here](https://python.langchain.com/docs/modules/chains/foundational/llm_chain#:~:text=predict%20is%20similar%20to%20run%20method%20except%20that%20the%20input%20keys%20are%20specified%20as%20keyword%20arguments%20instead%20of%20a%20Python%20dict.))

So if you could call `run` with input keys are keyword args, what is the differences between `predict` and `run`? What
is true? What is false? What the F?

