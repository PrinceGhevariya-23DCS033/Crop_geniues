import traceback
try:
    import app
    print('imported')
except Exception:
    traceback.print_exc()
