#!/usr/bin/env python3
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2]
app=json.loads((root/'apps/mobile/app.json').read_text())['expo']
assert app['version']=='1.0.0'
assert app['ios']['bundleIdentifier']=='com.xuanz3.repairflow.mobile'
assert app['android']['package']=='com.xuanz3.repairflow.mobile'
assert app['plugins'][2][1]['microphonePermission'] is False
assert app['plugins'][2][1]['recordAudioAndroid'] is False
print('Mobile native release contract passed.')
