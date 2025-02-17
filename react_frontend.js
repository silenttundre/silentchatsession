import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const socket = io('https://your-backend-url.com'); // Replace with your backend URL

const VideoChat = ({ roomId }) => {
    const [peers, setPeers] = useState([]);
    const userVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

            socket.emit('join-room', roomId, socket.id);

            socket.on('user-connected', userId => {
                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream
                });

                peer.on('signal', signal => {
                    socket.emit('signal', userId, signal);
                });

                peersRef.current.push({ peer, userId });
                setPeers([...peersRef.current]);

                socket.on('signal', (userId, signal) => {
                    const peer = peersRef.current.find(p => p.userId === userId).peer;
                    peer.signal(signal);
                });
            });

            socket.on('user-disconnected', userId => {
                const peer = peersRef.current.find(p => p.userId === userId).peer;
                peer.destroy();
                peersRef.current = peersRef.current.filter(p => p.userId !== userId);
                setPeers(peersRef.current);
            });
        });
    }, [roomId]);

    return (
        <div>
            <video ref={userVideo} autoPlay muted />
            {peers.map((peer, index) => (
                <video key={index} ref={ref => ref && (ref.srcObject = peer.peer.stream)} autoPlay />
            ))}
        </div>
    );
};

export default VideoChat;