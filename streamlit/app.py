import streamlit as st
from agent import Receptionist
import time

st.title("Adalanta")

if input := st.chat_input("Ask a question"):
    hook = st.empty()
    container = st.container()
    def publish(str):
        message = container.chat_message("assistant")
        message.write(str)
    output = Receptionist(publish).run(input)
    publish(output)
