import requests
import json
import uuid

BASE_URL = "http://localhost:8002"

print("--- Starting API Testing ---")

# 1. Health Check
print("1. Testing Health Check")
try:
    resp = requests.get(f"{BASE_URL}/api/health")
    print(f"Health Status: {resp.status_code}")
    print(resp.json())
except Exception as e:
    print(f"Health check failed: {e}")

# 2. Auth Testing
print("\n2. Testing Auth API")
test_user = f"test_{uuid.uuid4().hex[:8]}@example.com"
test_pass = "password123"
token = None

try:
    # Register
    print(f" Registering {test_user}")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Test User",
        "email": test_user,
        "password": test_pass
    })
    print(f"Register status: {resp.status_code}")
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        print("Registration successful, got token.")
    
    # Login
    print(f" Logging in {test_user}")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_user,
        "password": test_pass
    })
    print(f"Login status: {resp.status_code}")
    if not token and resp.status_code == 200:
        token = resp.json().get("access_token")
        
    # Profile
    if token:
        print(" Fetching profile")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
        print(f"Profile status: {resp.status_code}")
        print(resp.json())
        
except Exception as e:
    print(f"Auth testing failed: {e}")

# 3. Workflow Testing
print("\n3. Testing Workflow API")
workflow_id = None
if token:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Create
        print(" Creating workflow")
        wf_data = {
            "name": "Test Workflow",
            "description": "API Test",
            "workflow_json": {
                "nodes": [
                    {"id": "node1", "type": "trigger", "data": {"label": "Trigger"}},
                    {"id": "node2", "type": "action", "data": {"label": "Action"}}
                ],
                "edges": [{"source": "node1", "target": "node2"}]
            }
        }
        resp = requests.post(f"{BASE_URL}/workflows/", json=wf_data, headers=headers)
        print(f"Create Workflow status: {resp.status_code}")
        if resp.status_code == 201:
            workflow_id = resp.json().get("id")
            print(f"Created workflow ID: {workflow_id}")
            
        # List
        print(" Listing workflows")
        resp = requests.get(f"{BASE_URL}/workflows/", headers=headers)
        print(f"List Workflows status: {resp.status_code}, count: {len(resp.json())}")
        
    except Exception as e:
        print(f"Workflow API testing failed: {e}")

# 4. Execution Testing
print("\n4. Testing Execution API")
if token and workflow_id:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Execute
        print(f" Executing workflow {workflow_id}")
        resp = requests.post(f"{BASE_URL}/workflows/{workflow_id}/execute", headers=headers)
        print(f"Execute Workflow status: {resp.status_code}")
        print(json.dumps(resp.json(), indent=2))
        
        # List executions
        print(f" Listing executions for workflow {workflow_id}")
        resp = requests.get(f"{BASE_URL}/workflows/{workflow_id}/executions", headers=headers)
        print(f"List Executions status: {resp.status_code}, count: {len(resp.json())}")
        
    except Exception as e:
        print(f"Execution API testing failed: {e}")

# 5. Error Scenario Testing
print("\n5. Error Scenario Testing")
try:
    # Invalid Login
    print(" Invalid Login")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword"
    })
    print(f"Expected 401, got: {resp.status_code}")
    
    # Missing Auth Token
    print(" Missing Auth Token")
    resp = requests.get(f"{BASE_URL}/auth/profile")
    print(f"Expected 401, got: {resp.status_code}")
    
    # Invalid Workflow ID
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        print(" Invalid Workflow Execution")
        resp = requests.post(f"{BASE_URL}/workflows/99999/execute", headers=headers)
        print(f"Expected 404, got: {resp.status_code}")
        
except Exception as e:
    print(f"Error scenario testing failed: {e}")

print("\n--- API Testing Complete ---")
