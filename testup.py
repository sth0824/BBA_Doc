import os
import sys
import json
import pathlib
import colorama
import requests
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from starlette.websockets import WebSocketDisconnect, WebSocketState
from pydantic import BaseModel
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import uvicorn
from testhos import get_hospital_data
from colorama import Fore, Style
from fastapi.templating import Jinja2Templates
from fastapi import Request
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

# Windows 환경에서 컬러 출력을 위한 초기화
colorama.init()

# 환경변수 로드
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kakao OAuth 설정
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

class KakaoToken(BaseModel):
    code: str

def create_hospital_documents():
    hospital_data = get_hospital_data()
    documents = [Document(page_content=text, metadata={}) for text in hospital_data]
    return documents

# 정적 파일 경로 설정
static_path = Path(__file__).parent / "static"
templates = Jinja2Templates(directory="static")

# 정적 파일 마운트
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

@app.get("/")
async def read_root(request: Request):
    kakao_key = os.getenv("KAKAO_APP_KEY")
    print(f"Using KAKAO_APP_KEY: {kakao_key}")
    return templates.TemplateResponse("index.html", {
        "request": request,
        "KAKAO_APP_KEY": kakao_key
    })

def setup_qa_system():
    contextualize_q_system_prompt = """이전 대화 내용과 최신 사용자 질문이 있을 때, 이 질문이 이전 대화 내용과 관련이 있을 수 있습니다. 
    이런 경우, 대화 내용을 알 필요 없이 독립적으로 이해할 수 있는 질문으로 바꾸세요. 
    질문에 답할 필요는 없고, 필요하다면 그저 다시 구성하거나 그대로 두세요.
    모든 응답은 반드시 한국어로 작성해야 합니다."""

    qa_system_prompt = """용인시 수지구의 병원 정보를 제공하는 의료 상담 보조원입니다.
    사용자의 기본 위치는 용인시 수지구입니다.
    모든 답변은 반드시 한국어로 작성해야 합니다.
    
    다음과 같은 원칙을 따라 답변해주세요:
    1. 응급 상황이나 증상 문의시:
       - 가장 적절한 진료과를 추천
       - 현재 운영 중인 가까운 병원 3곳 추천 (주소와 전화번호 포함)
       - 야간/공휴일인 경우 24시간 운영하는 병원 우선 추천
    
    2. 특정 지역 문의시:
       - 해당 동네(예: 죽전동, 상현��� 등)의 관련 병원들 우선 추천
    
    3. 진료과 문의시:
       - 해당 진료과의 병원들을 영업시간과 함께 추천
    
    4. 모든 추천시 병원명, 주소, 전화번호, 영업시간을 포함해주세요.
    
    5. 답변 형식:
       - 모든 답변은 한국어로 작성
    
    {context}"""

    return contextualize_q_system_prompt, qa_system_prompt

def create_rag_chain():
    documents = create_hospital_documents()
    embeddings = UpstageEmbeddings(model="solar-embedding-1-large")
    vectorstore = Chroma.from_documents(documents, embeddings)
    retriever = vectorstore.as_retriever(k=4)

    chat = ChatUpstage(
        upstage_api_key=os.getenv("UPSTAGE_API_KEY"),
        model="solar-pro"
    )
    
    contextualize_q_system_prompt, qa_system_prompt = setup_qa_system()
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    history_aware_retriever = create_history_aware_retriever(
        chat, 
        retriever, 
        contextualize_q_prompt
    )
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(chat, qa_prompt)
    
    return create_retrieval_chain(history_aware_retriever, question_answer_chain)

def run_terminal_mode():
    print(f"{Fore.CYAN}=== 용인시 수지구 병원 정보 챗봇 ==={Style.RESET_ALL}")
    print(f"{Fore.GREEN}증상, 진료과목, 또는 원하시는 지역의 병원을 물어보세요!{Style.RESET_ALL}")
    print(f"{Fore.GREEN}예시: '가 아파요', '소아과 알려주세요', '상현동 병원 알려주세요'{Style.RESET_ALL}")
    
    try:
        rag_chain = create_rag_chain()
        chat_history = []
        
        while True:
            user_input = input(f"\n{Fore.YELLOW}질문을 입력하세요 (종료하려면 'quit' 입력): {Style.RESET_ALL}")
            
            if user_input.lower() == 'quit':
                print(f"{Fore.CYAN}챗봇을 종료합니다. 빠른 쾌유를 빕니다!{Style.RESET_ALL}")
                break
            
            result = rag_chain.invoke({
                "input": user_input,
                "chat_history": chat_history
            })
            
            print(f"\n{Fore.BLUE}[답변]{Style.RESET_ALL}")
            print(result["answer"])
            
            if result.get("context"):
                print(f"\n{Fore.MAGENTA}[참고 정보]{Style.RESET_ALL}")
                for doc in result["context"]:
                    print(doc.page_content)
            
            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": result["answer"]})
            
            if len(chat_history) > 4:
                chat_history = chat_history[-4:]

    except Exception as e:
        print(f"{Fore.RED}오류가 발생했습니다: {str(e)}{Style.RESET_ALL}")

# 카카오 로그인 관련 새로운 엔드포인트
@app.post("/api/kakao/login")
async def kakao_login(token: KakaoToken):
    try:
        # 카카오 액세스 토큰 받기
        token_url = "https://kauth.kakao.com/oauth/token"
        data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_CLIENT_ID,
            "redirect_uri": KAKAO_REDIRECT_URI,
            "code": token.code
        }
        token_response = requests.post(token_url, data=data)
        access_token = token_response.json().get("access_token")

        # 카카오 사용자 정보 받기
        user_url = "https://kapi.kakao.com/v2/user/me"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-type": "application/x-www-form-urlencoded;charset=utf-8"
        }
        user_response = requests.get(user_url, headers=headers)
        user_info = user_response.json()

        # 사용자 정보 반환
        return JSONResponse(content={
            "status": "success",
            "user": {
                "id": user_info.get("id"),
                "nickname": user_info.get("properties", {}).get("nickname"),
                "email": user_info.get("kakao_account", {}).get("email")
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.get("/oauth")
async def kakao_oauth(request: Request, code: str = None):
    if code:
        try:
            # 액세스 토큰 요청
            token_url = "https://kauth.kakao.com/oauth/token"
            data = {
                "grant_type": "authorization_code",
                "client_id": os.getenv("KAKAO_CLIENT_ID"),
                "redirect_uri": "https://bba-doc-1.onrender.com/oauth",
                "code": code
            }
            token_response = requests.post(token_url, data=data)
            token_data = token_response.json()
            
            # OAuth 콜백 페이지 렌더링
            return templates.TemplateResponse("oauth_callback.html", {
                "request": request,
                "token": token_data.get("access_token")
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    return HTTPException(status_code=400, detail="Authorization code not provided")
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        
        rag_chain = create_rag_chain()
        chat_history = []
        
        while True:
            try:
                data = await websocket.receive_text()
                user_input = json.loads(data)["message"]
                
                result = rag_chain.invoke({
                    "input": user_input,
                    "chat_history": chat_history
                })
                
                chat_history.append({"role": "user", "content": user_input})
                chat_history.append({"role": "assistant", "content": result["answer"]})
                
                if len(chat_history) > 4:
                    chat_history = chat_history[-4:]
                
                context_str = "\n".join([str(doc.page_content) for doc in result["context"]]) if result.get("context") else ""
                
                await websocket.send_json({
                    "answer": result["answer"],
                    "context": context_str
                })
                
            except WebSocketDisconnect:
                print("Client disconnected")
                break
            except json.JSONDecodeError:
                print("Invalid JSON received")
                await websocket.send_json({
                    "error": "Invalid message format"
                })
            except Exception as e:
                print(f"Error processing message: {str(e)}")
                try:
                    await websocket.send_json({
                        "error": "An error occurred while processing your message"
                    })
                except:
                    break
    
    except WebSocketDisconnect:
        print("Client disconnected during connection setup")
    except Exception as e:
        print(f"Error in websocket connection: {str(e)}")
    finally:
        try:
            print("Closing WebSocket connection")
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except Exception as e:
            print(f"Error closing websocket: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--web":
        port = int(os.getenv("PORT", 8000))
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        run_terminal_mode()