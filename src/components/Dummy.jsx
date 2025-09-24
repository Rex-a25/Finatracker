import React from 'react'

const Dummy = () => {
    let serch = fetch ('https://jsonplaceholder.typicode.com/users')
    serch.then(data => data.json)
    serch.then(data=> console.log(data))

  return (
    <div>
      {serch}
    </div>
  )
}

export default Dummy
