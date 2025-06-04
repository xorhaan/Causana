from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
from statsmodels.tsa.stattools import grangercausalitytests
from typing import List
import tempfile
import os

app = FastAPI()

@app.post("/analyze")

async def analyze(
    file: UploadFile = File(...),
    method: str = Form(...),
    lags: int = Form(...),
    window: int = Form(...)
):
    with tempfile.NamedTemporaryFile(delete=False,suffix=".csv") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name
    try:
        df = pd.read_csv(tmp_path)
        variables = df.columns.tolist()
        nodes = list(variables)
        edges = []

        for i, source in enumerate(variables):
            for j, target in enumerate(variables):
                if i == j:
                    continue
                test_data = df[[target,source]]
                try:
                    result = grangercausalitytests(test_data, maxlag = lags, verbose = False)
                    p_values = [result[lag][0]["ssr_ftest"][1] for lag in range(1, lags+1)]
                    min_p = min(p_values)
                    if min_p< 0.05:
                        lag = p_values.index(min_p) + 1
                        edges.append({
                            "source": source,
                            "target": target,
                            "weight": round(1-min_p, 2),
                            "lag": lag
                        })
                except Exception:
                    continue
        return JSONResponse(content={"nodes": nodes, "edges": edges})
    finally:
        os.remove(tmp_path)

