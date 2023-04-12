import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

export class RequestModule {
  static async getCurrentIpAddress(): Promise<string> {
    try {
      const url: string = `https://api.ipify.org?format=json`
      const options: AxiosRequestConfig = {}
      const response: AxiosResponse = await axios.get(url, options)
      const ip: string = response.data.ip
      console.log(`Current IP address: ${ip}`.yellow)

      return ip
    } catch (e: any) {
      console.log(e?.message?.red)
      process.exit(1)
    }
  }

  static async registerCurrentProcess(ip: string): Promise<void> {
    try {
      const status: boolean = true 
      if (!status) {
        throw new Error('Не удалось зарегестрировать процесс')
      }
    } catch (e: any) {
      console.log(e?.message?.red)
      process.exit(1)
    }
  }
}