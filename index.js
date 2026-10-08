(function () {
  const { registerCommand } = vendetta.commands;
  const { findByProps } = vendetta.metro;
  const { storage } = vendetta.plugin;

  const MODEL = "openai/gpt-oss-120b";

  const { sendBotMessage } = findByProps("sendBotMessage");
  const unregister = [];

  function command(name, description, optName, optDesc, execute) {
    return {
      name,
      displayName: name,
      description,
      displayDescription: description,
      options: [
        {
          name: optName,
          displayName: optName,
          description: optDesc,
          displayDescription: optDesc,
          required: true,
          type: 3,
        },
      ],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute,
    };
  }

  return {
    onLoad() {
      unregister.push(
        registerCommand(
          command("aikey", "Зберегти ключ Groq", "key", "API ключ", (args, ctx) => {
            storage.key = args[0].value.trim();
            sendBotMessage(ctx.channel.id, "Ключ збережено.");
          })
        )
      );

      unregister.push(
        registerCommand(
          command("ai", "Спитати ШІ (бачите лише ви)", "question", "Ваше питання", async (args, ctx) => {
            if (!storage.key) {
              sendBotMessage(ctx.channel.id, "Спочатку: /aikey і ваш ключ.");
              return;
            }
            try {
              const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + storage.key,
                },
                body: JSON.stringify({
                  model: MODEL,
                  messages: [{ role: "user", content: args[0].value }],
                }),
              });
              const data = await res.json();
              const text =
                data?.choices?.[0]?.message?.content ||
                "Помилка: " + (data?.error?.message || "порожня відповідь");
              sendBotMessage(ctx.channel.id, text.slice(0, 1900));
            } catch (e) {
              sendBotMessage(ctx.channel.id, "Помилка запиту: " + e.message);
            }
          })
        )
      );
    },
    onUnload() {
      unregister.forEach((u) => u());
    },
  };
})()
