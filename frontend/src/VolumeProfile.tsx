// React import not needed with new JSX transform
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { Tooltip, useTooltip } from '@visx/tooltip';

interface VolumeBin {
  price: number;
  buyVol: number;
  sellVol: number;
}

interface VolumeData {
  time: number;
  bins: VolumeBin[];
}

interface VolumeProfileProps {
  data: VolumeData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

// SVG renderer for volume profiles
function SvgVolumeProfile({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 30, left: 50 }
}: VolumeProfileProps) {
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip<VolumeBin>();
  
  if (!data.length) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No volume data available</p>
      </div>
    );
  }
  
  // Compute scales
  const allPrices = Array.from(new Set(
    data.flatMap(d => d.bins.map(bin => bin.price))
  )).sort((a, b) => b - a); // Descending order for price axis
  
  const times = data.map(d => d.time);
  const maxVol = Math.max(
    ...data.flatMap(d => d.bins.flatMap(bin => [bin.buyVol, bin.sellVol]))
  );
  
  if (maxVol === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No volume data to display</p>
      </div>
    );
  }
  
  const yScale = scaleBand({
    domain: allPrices,
    range: [margin.top, height - margin.bottom],
    padding: 0.1
  });
  
  const xScale = scaleBand({
    domain: times,
    range: [margin.left, width - margin.right],
    padding: 0.1
  });
  
  const volScale = scaleLinear({
    domain: [0, maxVol],
    range: [0, xScale.bandwidth() / 2]
  });
  
  const barHeight = yScale.bandwidth();
  
  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group>
          {/* Volume profile bars */}
          {data.map((bucket, bucketIndex) => {
            const bx = xScale(bucket.time) || 0;
            return bucket.bins.map((bin, binIndex) => {
              const y0 = (yScale(bin.price) || 0);
              const buyW = volScale(bin.buyVol) || 0;
              const sellW = volScale(bin.sellVol) || 0;
              
              return (
                <Group key={`${bucketIndex}-${binIndex}`}>
                  {/* Buy volume (green, right side) */}
                  {bin.buyVol > 0 && (
                    <rect
                      x={bx + xScale.bandwidth() / 2}
                      y={y0}
                      width={buyW}
                      height={barHeight}
                      fill="rgba(0, 160, 0, 0.6)"
                      stroke="rgba(0, 160, 0, 0.8)"
                      strokeWidth={1}
                      onMouseEnter={(event) => {
                        showTooltip({
                          tooltipData: bin,
                          tooltipLeft: event.clientX,
                          tooltipTop: event.clientY,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                  )}
                  {/* Sell volume (red, left side) */}
                  {bin.sellVol > 0 && (
                    <rect
                      x={bx + xScale.bandwidth() / 2 - sellW}
                      y={y0}
                      width={sellW}
                      height={barHeight}
                      fill="rgba(220, 38, 127, 0.6)"
                      stroke="rgba(220, 38, 127, 0.8)"
                      strokeWidth={1}
                      onMouseEnter={(event) => {
                        showTooltip({
                          tooltipData: bin,
                          tooltipLeft: event.clientX,
                          tooltipTop: event.clientY,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                  )}
                </Group>
              );
            });
          })}
          
          {/* Axes */}
          <AxisLeft
            scale={yScale}
            left={margin.left}
            tickFormat={(value) => `$${Number(value).toFixed(2)}`}
            stroke="#333"
            tickStroke="#333"
            tickLabelProps={{
              fill: '#333',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
              dx: -4,
            }}
          />
          <AxisBottom
            scale={xScale}
            top={height - margin.bottom}
            tickFormat={(value) => new Date(Number(value)).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            stroke="#333"
            tickStroke="#333"
            tickLabelProps={{
              fill: '#333',
              fontSize: 11,
              textAnchor: 'middle',
            }}
          />
        </Group>
      </svg>
      
      {/* Tooltip */}
      {tooltipData && (
        <Tooltip left={tooltipLeft} top={tooltipTop}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '8px 12px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <div><strong>Price: ${tooltipData.price.toFixed(2)}</strong></div>
            <div style={{ color: 'green' }}>Buy Volume: {tooltipData.buyVol.toFixed(2)}</div>
            <div style={{ color: '#dc267f' }}>Sell Volume: {tooltipData.sellVol.toFixed(2)}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

// Main export - simplified to only use SVG for now
export function VolumeProfileChart(props: VolumeProfileProps) {
  return <SvgVolumeProfile {...props} />;
}

export type { VolumeData, VolumeBin }; 