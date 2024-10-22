import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from langchain.prompts.chat import ChatPromptTemplate
from langchain.docstore.document import Document
import chromadb
from chromadb.utils import embedding_functions

# 필요한 라이브러리 설치 (처음 한 번만 실행)
# !pip install langchain openai chromadb tiktoken sentence-transformers langchain-openai

# 텍스트 파일 직접 읽기
def load_document(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        text = file.read()
    return Document(page_content=text)

# 문서 로드 (파일 경로를 정확히 지정해주세요)
document = load_document("C:/Users/20201/OneDrive/바탕 화면/BBA_DOC_m/bbadoc/data/경기도_용인시_수지구_진료기관_현황.txt")

# 텍스트 분할
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)
docs = text_splitter.split_documents([document])

# Chroma 클라이언트 및 컬렉션 설정
client = chromadb.Client()
embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="jhgan/ko-sroberta-multitask")
collection = client.create_collection(name="medical_facilities", embedding_function=embedding_function)

# 문서 추가
for i, doc in enumerate(docs):
    collection.add(
        documents=[doc.page_content],
        metadatas=[{"source": f"doc_{i}"}],
        ids=[f"id_{i}"]
    )

# LLM 설정 (OpenAI API 키 필요)
os.environ["OPENAI_API_KEY"] = "YOUR_API_KEY"

# 프롬프트 템플릿 설정
template = """당신은 용인시 수지구의 의료 기관 정보를 제공하는 유용한 조수입니다.
사용자의 질문에 대해 주어진 정보를 바탕으로 정확하고 상세하게 답변해 주세요."""
human_template = "{text}"
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", template),
    ("human", human_template),
])

chain = chat_prompt | llm

# 검색 및 요약 함수
def search_and_summarize(query):
    results = collection.query(query_texts=[query], n_results=5)
    context = "\n".join(results['documents'][0])
    result = chain.invoke({"text": f"Query: {query}\nContext: {context}"})
    return result.content

# 사용 예시
print(search_and_summarize("수지구에 있는 내과 병원 목록을 알려주세요."))
print(search_and_summarize("수지구에서 주말에도 운영하는 병원은 어디인가요?"))