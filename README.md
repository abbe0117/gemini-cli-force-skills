# How to Force Gemini CLI to Always Activate a Skill on Startup

If you use heavy workflow skills in Gemini CLI (like a custom `using-superpowers` or `test-driven-development` skill), relying on the AI to remember to load them via system prompts can be flaky. Sometimes the agent just forgets and skips straight to answering your question.

This guide provides a robust, program-level solution using Gemini CLI's **Hook System**. It automatically locks the session and forces the CLI to call the `activate_skill` tool on the very first turn of every new chat, guaranteeing your workflow rules are loaded before a single line of code is written.

## The Solution

We use a `BeforeToolSelection` hook. On the first turn of a new session, the hook intercepts the request and overrides the AI's `toolConfig`, forcing it into `"mode": "ANY"` while exclusively whitelisting the `activate_skill` tool. It also drops a lock file in the `~/.gemini/tmp/` directory so the hook gets out of the way for the rest of the session.

## 🚀 One-Step Installation Script

You can install this automatically using the Node.js script below. It creates the hook logic and safely injects it into your `~/.gemini/settings.json`.

Run the installation script with:

```bash
node install-hook.js
```

### How to use it
Once installed, the system handles the rest. Just make sure your global instructions (`~/.gemini/GEMINI.md`) contain a simple line telling the AI *which* skill it should prioritize, for example:
> *"Always activate the 'using-superpowers' skill before starting any task."*

The hook forces the AI to open the toolbox, and your instructions tell it which tool to grab.
