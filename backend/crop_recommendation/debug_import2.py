import traceback
try:
    import app
    print('imported OK')
except Exception:
    traceback.print_exc()
