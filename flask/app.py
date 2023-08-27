from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
from agent import Receptionist
import threading
from flask import copy_current_request_context

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# We'll use this to track messages and their corresponding thread statuses.
# This will look like { 'user1': {'messages': [], 'thread_status': 'done'} }
user_data = {}
user_to_sid = {}
count = 0

@app.route('/get_messages', methods=['GET'])
@cross_origin()
def get_messages():
    print("client requests messages")
    return jsonify([message for data in user_data.values() for message in data['messages']])

@app.route('/get_status/<user>', methods=['GET'])
@cross_origin()
def get_status(user):
    if user in user_data:
        return jsonify(status=user_data[user]['thread_status'])
    else:
        return jsonify(status='error', message='No thread started for this user'), 404

@socketio.on('send_message')
def handle_message(data): 
    print("client sending a message")
    user = data['user']

    # If this user is not in our data yet, initialize their info
    if user not in user_data:
        user_data[user] = {'messages': [], 'thread_status': 'done'}

    # Only append the message and start a thread if no active thread for this user
    if user_data[user]['thread_status'] == 'done':
        message = {
            'user': user,
            'text': data['text']
        }
        user_data[user]['messages'].append(message)
        client_sid = user_to_sid.get(user)
        if client_sid:
            socketio.emit('receive_message', message, room=client_sid)
        
        @copy_current_request_context
        def thread_function():
            user_data[user]['thread_status'] = 'running'
            Receptionist(get_notifier(user)).run(data['text'])
            user_data[user]['thread_status'] = 'done'

        thread = threading.Thread(target=thread_function)
        thread.start()

def get_notifier(user):
    def notify(log):
        print("publishing")
        message = {
            'user': "agent",
            'text': log
        }
        user_data[user]['messages'].append(message)
        # Fetch the sid for the user and emit the message
        client_sid = user_to_sid.get(user)
        if client_sid:
            socketio.emit('receive_message', message, room=client_sid)
    return notify

@socketio.on("connect")
def connected():
    global count
    count += 1
    print(f"client has connected, active client count:{count}")
    user = request.args.get('user')
    if user:
        user_to_sid[user] = request.sid

@socketio.on("disconnect")
def disconnected():
    global count
    count -= 1
    print(f"client disconnected, active client count:{count}")


if __name__ == '__main__':
    socketio.run(app, debug=True)
