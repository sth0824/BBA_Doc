# Python으로 환경변수가 제대로 설정되었는지 확인
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("UPSTAGE_API_KEY")
print(api_key)  # API 키가 출력되어야 합니다