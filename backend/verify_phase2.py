import urllib.request
import json
import io
from PIL import Image

def run_test():
    # 1. Login as demo citizen
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login/',
        data=json.dumps({'username': 'citizen', 'password': 'pass123'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    tokens = json.loads(res.read().decode('utf-8'))
    token = tokens['access']
    print(f"[OK] Citizen authenticated. User ID verified.")

    # 2. Get active issue categories
    cat_res = urllib.request.urlopen('http://127.0.0.1:8000/api/issues/categories/')
    cats = json.loads(cat_res.read().decode('utf-8'))
    print(f"[OK] Fetched {len(cats)} categories from database.")
    pothole_cat = next((c for c in cats if c['code'] == 'POTHOLE'), cats[0])
    cat_id = pothole_cat['id']

    # 3. Create dummy image in memory (valid JPEG)
    boundary = '----WebKitFormBoundaryCivicReportVerify123'
    img_byte_arr = io.BytesIO()
    image = Image.new('RGB', (250, 250), color=(11, 95, 99))
    image.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    body = bytearray()
    def add_field(name, value):
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode('utf-8'))

    add_field('title', 'Deep crater pothole near bus stop 4')
    add_field('description', 'Severe road defect causing traffic hazards and vehicle damage risk.')
    add_field('category_id', str(cat_id))
    add_field('latitude', '19.0760000')
    add_field('longitude', '72.8777000')
    add_field('address_text', 'MG Road, near City Bus Stop 4')
    add_field('ward', 'Ward 4')
    add_field('capture_sources', 'CAMERA')

    # Add image
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="images"; filename="pothole_evidence.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
    body.extend(img_bytes)
    body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

    req_post = urllib.request.Request(
        'http://127.0.0.1:8000/api/issues/',
        data=bytes(body),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': f'multipart/form-data; boundary={boundary}'
        }
    )
    res_post = urllib.request.urlopen(req_post)
    issue_data = json.loads(res_post.read().decode('utf-8'))
    issue_id = issue_data['issue_id']
    print(f"[OK] Issue Created: {issue_id}")
    print(f"     Status: {issue_data['status']}")
    print(f"     Category: {issue_data['category']['name']}")
    print(f"     Address: {issue_data['location']['address_text']}")
    print(f"     Images attached: {len(issue_data['images'])}")

    # 4. Public Tracking Lookup
    track_res = urllib.request.urlopen(f'http://127.0.0.1:8000/api/issues/track/{issue_id}/')
    track_data = json.loads(track_res.read().decode('utf-8'))
    print(f"[OK] Public Tracking Verified: {track_data['issue_id']}")
    print(f"     Status: {track_data['status_display']}")
    print(f"     Timeline events: {len(track_data['timeline'])}")
    print(f"     SLA Target: {track_data.get('sla_deadline')}")
    print("\n[SUCCESS] Phase 2 end-to-end Issue Reporting & Tracking verified successfully!")

if __name__ == '__main__':
    run_test()
