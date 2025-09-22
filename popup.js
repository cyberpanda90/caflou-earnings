function getCurrentMonthRange() {
	const now = new Date()
	const start = new Date(now.getFullYear(), now.getMonth(), 1)
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
	const fmt = (d) => d.toISOString().split('T')[0]
	return { start: fmt(start), end: fmt(end) }
}

const { start, end } = getCurrentMonthRange()

const CACHE_BUSTER = `_=${Date.now()}`

const TARGET_URL =
	`https://mimedigital.caflou.cz/mime-digital/time_entries?` +
	`filter[start_date]=${start}&` +
	`filter[end_date]=${end}&` +
	`filter[only_mine]=true&filter_opened=true&page=1&per=100&${CACHE_BUSTER}`

const STATUS = document.getElementById('status')
const AMOUNT = document.getElementById('amount')

function waitForComplete(tabId, timeoutMs = 20000) {
	return new Promise((resolve, reject) => {
		const t0 = Date.now()

		function onUpdated(updatedTabId, info) {
			if (updatedTabId === tabId && info.status === 'complete') {
				chrome.tabs.onUpdated.removeListener(onUpdated)
				resolve()
			}
		}
		chrome.tabs.onUpdated.addListener(onUpdated)

		const timer = setInterval(async () => {
			if (Date.now() - t0 > timeoutMs) {
				chrome.tabs.onUpdated.removeListener(onUpdated)
				clearInterval(timer)
				reject(new Error('Timeout loading Caflou.'))
			}
			try {
				const t = await chrome.tabs.get(tabId)
				if (t.status === 'complete') {
					chrome.tabs.onUpdated.removeListener(onUpdated)
					clearInterval(timer)
					resolve()
				}
			} catch {}
		}, 300)
	})
}

function scrapeInPage() {
	return new Promise((resolve) => {
		const tryFind = (left = 24) => {
			const cell = document.querySelector(
				'.sumaries tbody tr:nth-child(3) td'
			)
			if (cell && cell.textContent.trim()) {
				resolve({ amount: cell.textContent.trim() })
			} else if (left > 0) {
				setTimeout(() => tryFind(left - 1), 250)
			} else {
				resolve({ amount: null })
			}
		}
		tryFind()
	})
}

async function run() {
	let tabId
	try {
		STATUS.textContent = 'Opening hidden Caflou tab…'

		const tab = await chrome.tabs.create({ url: TARGET_URL, active: false })
		tabId = tab.id

		await waitForComplete(tabId)

		STATUS.textContent = 'Reading summary…'

		const [{ result }] = await chrome.scripting.executeScript({
			target: { tabId },
			func: scrapeInPage,
		})

		if (result?.amount) {
			STATUS.textContent = 'Current amount:'
			AMOUNT.textContent = result.amount
		} else {
			STATUS.textContent = 'Failed to find amount'
			AMOUNT.textContent = '—'
		}
	} catch (e) {
		STATUS.textContent = 'Error'
		AMOUNT.textContent = e.message || String(e)
		console.error(e)
	} finally {
		if (tabId) {
			try {
				await chrome.tabs.remove(tabId)
			} catch {}
		}
	}
}

run()
