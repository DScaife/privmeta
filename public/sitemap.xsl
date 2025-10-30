<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>XML Sitemap - PrivMeta</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { font-size: 24px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      th { background-color: #f0f0f0; text-align: left; padding: 12px; }
      td { padding: 12px; border-bottom: 1px solid #eaeaea; }
      tr:hover { background-color: #f9f9f9; }
      .url-count { font-weight: bold; margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <h1>XML Sitemap - PrivMeta</h1>
    <div class="url-count">Total URLs: <xsl:value-of select="count(urlset/url)" /></div>
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Last Modified</th>
          <th>Change Frequency</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
        <xsl:for-each select="urlset/url">
          <tr>
            <td><xsl:element name="a">
              <xsl:attribute name="href"><xsl:value-of select="loc"/></xsl:attribute>
              <xsl:value-of select="loc"/>
            </xsl:element></td>
            <td><xsl:value-of select="lastmod"/></td>
            <td><xsl:value-of select="changefreq"/></td>
            <td><xsl:value-of select="priority"/></td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
  </body>
  </html>
</xsl:template>
</xsl:stylesheet>
