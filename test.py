import json
from backend.app.engine.graph_builder import run_workflow

with open('meme_workflow.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

result = run_workflow(data)
print(json.dumps(result, indent=2))
