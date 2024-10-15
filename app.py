from flask import Flask, jsonify, render_template
import pandas as pd
import os
import traceback

app = Flask(__name__, template_folder='test')

current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, 'data', '경기도_용인시_수지구_야간 공휴일 진료기관 현황_20140321..csv')

try:
    df = pd.read_csv(file_path, encoding='cp949')
    print(f"CSV 파일을 성공적으로 읽었습니다. 데이터 shape: {df.shape}")
    print(f"컬럼: {df.columns.tolist()}")
    print(f"첫 번째 행: {df.iloc[0].to_dict()}")
except FileNotFoundError:
    print(f"파일을 찾을 수 없습니다: {file_path}")
    df = pd.DataFrame()
except Exception as e:
    print(f"파일 읽기 오류: {e}")
    df = pd.DataFrame()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/hospitals')
def get_hospitals():
    try:
        if df.empty:
            return jsonify({"error": "데이터를 불러올 수 없습니다."}), 500
        hospitals = df.to_dict(orient='records')
        print(f"Returning {len(hospitals)} hospital records")
        return jsonify(hospitals)
    except Exception as e:
        print(f"Error in get_hospitals: {str(e)}")
        print(traceback.format_exc())  # 상세한 오류 정보 출력
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)