import streamlit as st
import time
import utils.config as config 
from agent import Receptionist
global receptionist

st.title("Adalanta")

# Initialize chat history
if "messages" not in st.session_state :
    st.session_state.messages = []
else:
    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])


    
if "receptionist" not in st.session_state:
    st.session_state.receptionist = Receptionist()

if input := st.chat_input("Ask a question"):
    hook = st.empty()
    
    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(input)
    st.session_state.messages.append({"role": "user", "content": input})

    output = st.session_state.receptionist.run(input)
    with st.chat_message("Adalanta"):
        st.markdown(output)
    st.session_state.messages.append({"role": "Adalanta", "content": output})
