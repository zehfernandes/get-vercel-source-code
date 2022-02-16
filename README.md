# Get Vercel Source Code

<img width="1530" alt="Screen Shot 2021-04-08 at 12 33 31" src="https://user-images.githubusercontent.com/1891339/114068653-88949800-9874-11eb-9083-99b9f5be615a.png">

## Instructions

1 - Install the dependecies.

```
npm i
```

2 - Get your Vercel token at https://vercel.com/account/tokens, copy `.env.sample` as `.env` and update the value:

```
VERCEL_TOKEN = ""
# Optionally if using a team account
VERCEL_TEAM = ""
```

3 - Run the script and wait until complete.

```
node index.js <VERCEL DEPLOYMENT URL or ID> <DESTINATION>
```

For example, `node index.js example-5ik51k4n7.vercel.app ../example`.

Or using the id directly, `node index.js dpl_6CR1uw9hBdpWgrMvPkncsTGRC18A ../example`.
