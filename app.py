import streamlit as st
import time
import utils.config as config 
from agent import Receptionist

st.title("Adalanta")
def publish(str):
    message = container.chat_message("assistant")
    message.write(str)
receptionist = Receptionist(publish)

if input := st.chat_input("Ask a question"):
    hook = st.empty()
    container = st.container()
    
    output = receptionist.run(input)
    publish(output)
