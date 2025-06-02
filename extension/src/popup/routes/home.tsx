import { CountButton } from "~features/count-button"

export const Home = () => {
  return (
    <>
      <h1>Clerk + Chrome Extension + React Router</h1>
      <CountButton />
      <button
        onClick={() => {
          chrome.tabs.create({
            url: "./tabs/background-worker-demo.html"
          })
        }}>
        Open background worker demo in a new tab
      </button>
    </>
  )
}
