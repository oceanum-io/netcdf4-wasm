# netcdf4-wasm Documentation

This directory contains the documentation website for netcdf4-wasm, built with Jekyll and deployed to GitHub Pages.

## Local Development

To run the documentation site locally:

### Prerequisites

- Ruby 2.7+ 
- Bundler gem

### Setup

```bash
cd docs
bundle install
```

### Development Server

```bash
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`

### Live Reload

For automatic rebuilding during development:

```bash
bundle exec jekyll serve --livereload
```

## Structure

```
docs/
├── _config.yml          # Jekyll configuration
├── index.md             # Homepage
├── api/                 # API documentation
│   ├── index.md
│   ├── dataset.md
│   └── variable.md
├── guides/              # User guides
│   ├── index.md
│   └── getting-started.md
├── examples/            # Code examples
│   ├── index.md
│   └── browser-files.md
└── Gemfile              # Ruby dependencies
```

## Adding Content

### New Guide

1. Create a new markdown file in `guides/`
2. Add front matter:
   ```yaml
   ---
   layout: page
   title: Your Guide Title
   ---
   ```
3. Add the guide to `guides/index.md`

### New Example

1. Create a new markdown file in `examples/`
2. Include runnable code examples
3. Add the example to `examples/index.md`

### New API Documentation

1. Create a new markdown file in `api/`
2. Follow the existing pattern for class documentation
3. Add the page to `api/index.md`

## GitHub Pages Configuration

**Important**: Ensure your GitHub repository is configured to use GitHub Actions for Pages deployment:

1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select "**GitHub Actions**"
3. The documentation will be available at `https://yourusername.github.io/netcdf4-wasm/`

The `docs/index.md` file serves as the root page of the documentation site.

## Deployment

Documentation is automatically deployed to GitHub Pages when:

- Changes are pushed to the `main` branch in the `docs/` directory
- The workflow can be manually triggered
- A new release is created

The deployment workflow:
1. Builds the Jekyll site from the `docs/` directory
2. Uses `docs/index.md` as the homepage
3. Uploads the built site to GitHub Pages
4. Makes it available at the configured GitHub Pages URL

## Writing Guidelines

### Code Examples

- Always provide complete, runnable examples
- Include error handling where appropriate
- Add comments explaining key concepts
- Use TypeScript types when relevant

### Links

- Use relative links for internal pages: `[API Reference](../api/)`
- Use absolute URLs for external links
- Check that all links work locally before committing

### Formatting

- Use descriptive headings
- Include code syntax highlighting: \`\`\`javascript
- Add tables for structured information
- Use callout boxes for important notes

## Troubleshooting

### Bundle Install Fails

```bash
# Update bundler
gem install bundler

# Clear cache and reinstall
bundle clean --force
bundle install
```

### Jekyll Build Errors

Check for:
- YAML front matter syntax errors
- Liquid template syntax issues
- Broken internal links
- Missing dependencies in Gemfile

### GitHub Pages Deploy Fails

1. Check the Actions tab for build logs
2. Verify Jekyll builds locally
3. Ensure all dependencies are in Gemfile
4. Check that `_config.yml` is valid

## Local Testing

Before pushing documentation changes:

1. Build locally: `bundle exec jekyll build`
2. Check for warnings or errors
3. Test all navigation links
4. Verify code examples are correct
5. Check responsive design on mobile

## Contributing

1. Create a feature branch for documentation changes
2. Test locally
3. Create a pull request
4. Documentation will be automatically deployed after merge