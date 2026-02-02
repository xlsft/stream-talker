export default defineAppConfig({
    ui: {
        formField: {
            slots: {
                label: 'text-xs font-bold text-muted mb-2',
                hint: 'text-xs font-bold text-muted mb-2 opacity-50'
            }
        },
        checkbox: {
            slots: {
                root: 'items-center',
                label: 'text-xs font-bold text-muted'
            }
        }
    }
})