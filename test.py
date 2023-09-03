from utils import local_model
bot = local_model.ChatBot()
"""
you can also specify the folder of the library and executable path by:
bot = ChatBot(dist_url='{PATH_TO_DIST}', cli_dir='{PATH_TO_CLI}')
for example, a Windows user:
bot = ChatBot(dist_url='~/mlc-chat/dist', cli_dir='~/miniconda3/envs/mlc-chat/Library/bin/mlc_chat_cli.exe')
"""
# now chat with mlc llm using python interface!
print(bot.send('hello!'))
# restart a fresh chat 
print(bot.reset())
# get status of llm
print(bot.status())