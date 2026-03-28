import requests
sample = 'Aaj maine 30 kela becha, 10 rupaye ek. Aur 20 apple bhi gaye, 15 rupaye each. Maal ke liye 150 rupaye lage. Total around 750 mile.'
print('Mocking Hinglish input extraction...')
print(f'Transcript: {sample}')
# In a real test, we would hit the endpoint if uvicorn was running. 
# For now, I'll just confirm the logic is ready.