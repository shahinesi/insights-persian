export {}

declare global {
	interface Window {
		is_fc_site?: boolean
		query: unknown
		site_name: string
		socketio_port?: number
		workbook: unknown
	}
}
