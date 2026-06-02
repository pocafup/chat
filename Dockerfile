FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry --quiet

COPY pyproject.toml poetry.lock ./

# 不建虚拟环境，直接装到系统 Python；只装生产依赖
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi

COPY . .

EXPOSE 8536

CMD ["gunicorn", "--bind", "0.0.0.0:8536", "--workers", "2", "app:app"]
