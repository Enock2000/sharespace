import subprocess
import json

cors_rules = [
    {
        "corsRuleName": "allowDirectUploadsAndDownloads",
        "allowedOrigins": ["*"],
        "allowedHeaders": ["*"],
        "allowedOperations": ["b2_upload_file", "b2_download_file_by_name", "b2_download_file_by_id"],
        "exposeHeaders": ["x-bz-content-sha1", "x-bz-file-name", "x-bz-file-id", "Content-Type", "Content-Length", "Accept-Ranges"],
        "maxAgeSeconds": 3600
    }
]

cors_json = json.dumps(cors_rules)
print(f"Setting CORS rules: {cors_json}")

result = subprocess.run(
    [
        r"C:\Users\ZedSMSTech\AppData\Roaming\Python\Python313\Scripts\b2.exe",
        "bucket", "update", "oraninve",
        "--cors-rules", cors_json
    ],
    capture_output=True,
    text=True
)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)
