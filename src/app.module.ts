import fastify from 'fastify'
import { RequestModule } from './request.module'


export class AppModule {
  static async init() {
    const ip = await RequestModule.getCurrentIpAddress()
    await RequestModule.registerCurrentProcess(ip)
  }

  static async create() {
    await this.init()

    const server = fastify()
    server.get('*', async (req, res) => {
      return { message: 'WORK' }
    })
    
    return server
  }

  static listenServerEvents() {
    
  }
}