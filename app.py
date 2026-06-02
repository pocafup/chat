import os
import anthropic
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

MODEL = "claude-sonnet-4-6"

# 声明 web_search 工具——由 Anthropic 服务器执行，客户端无需自己发请求
# web_search_20260209 是带动态过滤的最新版本
TOOLS = [
    {"type": "web_search_20260209", "name": "web_search"}
]

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "消息不能为空"}), 400

    try:
        # 用一份副本做循环，避免修改前端传来的原始列表
        loop_messages = list(messages)

        while True:
            response = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system="你是一个乐于助人的 AI 助手，请用中文回答。需要查询最新信息时请使用搜索工具。",
                tools=TOOLS,
                messages=loop_messages,
            )

            # pause_turn 表示服务器端搜索循环达到单次上限（默认 10 次），
            # 把本轮 assistant 消息追加后再调用一次，服务器会自动继续
            if response.stop_reason == "pause_turn":
                loop_messages.append({"role": "assistant", "content": response.content})
                continue

            # end_turn 或其他终止原因，退出循环
            break

        # response.content 可能包含 server_tool_use、search_result 等块，
        # 只取 text 块拼成最终回复
        reply = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return jsonify({"reply": reply})

    except anthropic.AuthenticationError:
        return jsonify({"error": "API key 无效，请检查 .env 文件"}), 401
    except anthropic.APIError as e:
        return jsonify({"error": f"API 调用失败：{e}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
