import express from 'express'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/expense', async (req, res) => {
	try {
		const url =
			'https://mimedigital.caflou.cz/mime-digital/time_entries?filter%5Bstart_date%5D=2025-09-01&filter%5Bend_date%5D=2025-09-30&filter%5Bonly_mine%5D=true&filter_opened=true&page=1&per=100'

		const response = await fetch(url)
		const html = await response.text()

		const $ = cheerio.load(html)
		const amount = $('.sumaries tbody tr:nth-child(3) td').text().trim()

		res.set('Access-Control-Allow-Origin', '*')
		res.json({ amount })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`)
})
