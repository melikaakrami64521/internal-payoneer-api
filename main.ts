import 'colors'
import { AppModule } from './src/app.module'

async function main() {
  const app = await AppModule.create()
  app.listen({ port: 5000 }, (e, address) => {
    if (e) {
      console.log(e?.message?.red)
      process.exit(1)
    }

    console.log(address)
  })

  AppModule.listenServerEvents()
}

main()

