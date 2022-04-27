interface Application {
    url: string
    sizes: number[]
}

export const APPLICATIONS = new Map<string, Application>()
    .set('7a31cfe8', {
        url: 'https://emoji.lgbt/assets/svg/{id}.svg',
        sizes: [32, 64, 128, 180, 256, 512, 1024]
    })
