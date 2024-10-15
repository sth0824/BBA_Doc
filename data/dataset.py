import pandas as pd
import os

# CSV 파일 경로
file_path = r"C:\Users\20201\OneDrive\바탕 화면\BBA_DOC\bbadoc\data\경기도_용인시_수지구_야간 공휴일 진료기관 현황_20140321..csv"

# 파일이 존재하는지 확인
if not os.path.exists(file_path):
    print("파일이 존재하지 않습니다.")
else:
    # CSV 파일 읽기
    df = pd.read_csv(file_path, encoding='cp949')  # 한글 인코딩을 위해 'cp949' 사용

    # 데이터 기본 정보 출력
    print("데이터 크기:", df.shape)
    print("\n컬럼명:")
    print(df.columns.tolist())

    # 각 컬럼의 데이터 타입 출력
    print("\n데이터 타입:")
    print(df.dtypes)

    # 처음 5개의 행 출력
    print("\n처음 5개 행:")
    print(df.head())

    # 결측값 확인
    print("\n결측값 개수:")
    print(df.isnull().sum())

    # 기본 통계 정보 (숫자형 데이터에 대해)
    print("\n기본 통계 정보:")
    print(df.describe())