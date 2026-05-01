import ast, sys
p = 'd:\\SEM_six_SGP\\Crop_geniues\\backend\\crop_recommendation\\app.py'
with open(p, 'rb') as f:
    data = f.read()
print('File bytes head:', data[:200])
try:
    s = data.decode('utf-8')
except Exception as e:
    print('Decode error:', e)
    sys.exit(1)
for i, line in enumerate(s.splitlines(), start=1):
    if '\t' in line:
        print('TAB at', i)
    if '\x0b' in line or '\x0c' in line:
        print('vertical/tab control at', i, repr(line))
    if any(ord(ch) < 32 and ch not in ('\n','\r','\t') for ch in line):
        print('Control char at', i, repr(line))

try:
    ast.parse(s)
    print('AST ok')
except Exception as e:
    import traceback
    traceback.print_exc()
