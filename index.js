import express from 'express'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3000

// endpoint GET /expense
app.get('/expense', async (req, res) => {
	try {
		const resp = await fetch(
			'https://mimedigital.caflou.cz/api/v1/mime-digital/time_entries?filter[start_date]=2025-09-01&filter[end_date]=2025-09-30&filter[only_mine]=true&filter_opened=true&page=1&per=100',
			{
				headers: {
					Authorization: `Bearer ${process.env.CAFLOU_TOKEN}`,
					Accept: 'application/json',
				},
			}
		)

		const data = await resp.json()
		// tady můžeš zpracovat JSON podle potřeby
		res.set('Access-Control-Allow-Origin', '*')
		res.json(data)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`)
})
