FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /app
COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN npm ci && chown -R pwuser:pwuser /app
COPY --chown=pwuser:pwuser . .
USER pwuser
ENV CI=true
CMD ["npm", "test"]
