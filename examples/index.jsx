import Peer from 'peerjs'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Layout } from 'antd'
import 'antd/dist/antd.css'

const {
  Header, Footer, Content
} = Layout

const App = () => {
  const [id, setId] = useState(null)
  useEffect(() => {
    console.log('PEER', Peer)

    const peer = new Peer()
    var conn = peer.connect('another-peers-id')
    conn.on('open', function () {
      setId(conn.id)
    })
    peer.on('connection', function (conn) {
      conn.on('data', function (data) {
        // Will print 'hi!'
        console.log(data)
      })
    })
  })

  return <Layout style={{
    height: '100vh',
    width: '100vw'
  }}>
    <Header style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#DA6855' }}>
      <div style={{ height: '100%', display: 'inline-block' }}>
        <img style={{ height: '100%' }} src='https://avatars0.githubusercontent.com/u/3409784?s=200&v=4' />
      </div>
    </Header>
    <Content>
      {id && <span>Your ID is {id}</span>}
    </Content>
    <Footer style={{ textAlign: 'center' }}>PeerJS Team</Footer>
  </Layout>
}

ReactDOM.render(<App />,
  document.getElementById('app')
)
