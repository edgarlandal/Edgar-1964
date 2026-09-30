import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart'
import type { ChartConfig } from './ui/chart'

const chartData = [
  { name: 'Turbo', wins: 2 },
  { name: 'Rayo', wins: 1 },
  { name: 'Lento', wins: 0 },
  { name: 'Baba', wins: 1 },
  { name: 'Caracolín', wins: 2 },
  { name: 'Hoja', wins: 0 },
]
const chartConfig = {
  wins: { label: 'Victorias', color: 'var(--chart-1)' },
} satisfies ChartConfig

export default function BarsSnails() {
  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>Resumen simulado</CardTitle>
        <CardDescription>
          Un día de seis carreras con seis caracoles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h2 className="font-semibold">Apuestas ganadas y perdidas</h2>
          <div
            className="donut"
            role="img"
            aria-label="4 apuestas ganadas y 2 perdidas"
          >
            <span>6</span>
          </div>
          <p>Ganadas: 4 (verde) · Perdidas: 2 (gris)</p>
        </section>
        <section className="min-w-0 space-y-2">
          <h2 className="font-semibold">Victorias por caracol</h2>
          <ChartContainer
            config={chartConfig}
            className="h-64 w-full aspect-auto"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ right: 24 }}
            >
              <XAxis
                type="number"
                dataKey="wins"
                domain={[0, 6]}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={76}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="wins" fill="var(--color-wins)" radius={4}>
                <LabelList dataKey="wins" position="right" />
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="text-sm text-muted-foreground">
            Total: 6 victorias. Cada carrera tiene un ganador.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
