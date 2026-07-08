import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'assemblyai-token-plugin',
        configureServer(server) {
          server.middlewares.use('/api/assemblyai-token', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            try {
              const apiKey = env.VITE_ASSEMBLYAI_API_KEY;
              if (!apiKey) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing AssemblyAI API key in .env.local' }));
                return;
              }

              // Using native https to avoid Node 18 undici IPv6 fetch timeout bugs
              const https = await import('https');

              const options = {
                hostname: 'streaming.assemblyai.com',
                port: 443,
                path: '/v3/token?expires_in_seconds=60',
                method: 'GET',
                family: 4, // Force IPv4
                headers: {
                  'Authorization': apiKey,
                  'Content-Type': 'application/json'
                }
              };

              const request = https.request(options, (response) => {
                let responseBody = '';
                response.on('data', (chunk) => responseBody += chunk);
                response.on('end', () => {
                  if (response.statusCode !== 200) {
                    res.statusCode = response.statusCode || 500;
                    res.end(JSON.stringify({ error: `AssemblyAI API Error: ${responseBody}` }));
                    return;
                  }
                  
                  res.statusCode = 200;
                  res.end(responseBody);
                });
              });

              request.on('error', (error) => {
                console.error('Error fetching AssemblyAI token via HTTPS:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
              });

              request.end();
              
            } catch (error: any) {
              console.error('Error fetching AssemblyAI token:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });

          server.middlewares.use('/api/speechmatics-token', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            try {
              const apiKey = env.VITE_SPEECHMATICS_API_KEY;
              if (!apiKey) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing Speechmatics API key in .env.local' }));
                return;
              }

              const https = await import('https');
              const data = JSON.stringify({ ttl: 60, type: "rt" });

              const options = {
                hostname: 'mp.speechmatics.com',
                port: 443,
                path: '/v1/api_keys?type=rt',
                method: 'POST',
                family: 4, // Force IPv4
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(data)
                }
              };

              const request = https.request(options, (response) => {
                let responseBody = '';
                response.on('data', (chunk) => responseBody += chunk);
                response.on('end', () => {
                  if (response.statusCode !== 201 && response.statusCode !== 200) {
                    res.statusCode = response.statusCode || 500;
                    res.end(JSON.stringify({ error: `Speechmatics API Error: ${responseBody}` }));
                    return;
                  }
                  
                  res.statusCode = 200;
                  res.end(responseBody);
                });
              });

              request.on('error', (error) => {
                console.error('Error fetching Speechmatics token via HTTPS:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
              });

              request.write(data);
              request.end();
              
            } catch (error: any) {
              console.error('Error fetching Speechmatics token:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });

          server.middlewares.use('/api/gladia-init', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            try {
              const apiKey = env.VITE_GLADIA_API_KEY;
              if (!apiKey) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing Gladia API key in .env.local' }));
                return;
              }

              const https = await import('https');
              const data = JSON.stringify({ 
                encoding: "wav/pcm", 
                sample_rate: 16000, 
                bit_depth: 16, 
                channels: 1 
              });

              const options = {
                hostname: 'api.gladia.io',
                port: 443,
                path: '/v2/live',
                method: 'POST',
                family: 4,
                headers: {
                  'x-gladia-key': apiKey,
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(data)
                }
              };

              const request = https.request(options, (response) => {
                let responseBody = '';
                response.on('data', (chunk) => responseBody += chunk);
                response.on('end', () => {
                  if (response.statusCode !== 201 && response.statusCode !== 200) {
                    res.statusCode = response.statusCode || 500;
                    res.end(JSON.stringify({ error: `Gladia API Error: ${responseBody}` }));
                    return;
                  }
                  
                  res.statusCode = 200;
                  res.end(responseBody);
                });
              });

              request.on('error', (error) => {
                console.error('Error fetching Gladia token via HTTPS:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
              });

              request.write(data);
              request.end();
              
            } catch (error: any) {
              console.error('Error initializing Gladia:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        '/api/groq': {
          target: 'https://api.groq.com/openai/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/groq/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (env.VITE_GROQ_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_GROQ_API_KEY}`);
              }
            });
          }
        },
        '/api/openai': {
          target: 'https://api.openai.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (env.VITE_OPENAI_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_OPENAI_API_KEY}`);
              }
            });
          }
        }
      }
    }
  };
});
