# Supported Tea URL Formats

This document outlines the various URL formats that can be used for loading tea data when scanning NFC tags or QR codes with the Tea Collection App.

## Simple Formats

### Direct Tea ID
The simplest format is just the tea ID:
```
001
```
```
g001
```
```
p002
```

This will be automatically converted to fetch the corresponding tea file from the `/tea/` directory with a `.cha` extension.

## URL-Based Formats

### Query Parameter Format
You can include the tea ID or full filename as a query parameter:

```
https://example.com/?tea=001.cha
```
```
https://example.com/?teaId=001
```

### Direct Path Format
You can specify the complete path to the tea file:

```
https://example.com/tea/001.cha
```
```
https://example.com/tea/g001.cha
```

## Best Practices

For the best compatibility across NFC tags and QR codes, we recommend using the simplest format possible:

1. **For physical tea packaging**: Use just the tea ID (e.g., "001")
2. **For sharing online**: Use the query parameter format with the teaId parameter
3. **For technical users**: The direct path format provides the most explicit control

## Examples for Common Teas

| Tea Name | Simple Format | Query Parameter Format |
|----------|---------------|------------------------|
| Earl Grey | `000` | `?teaId=000` |
| Mi Lan Xiang | `001` | `?teaId=001` |
| Dragonwell | `g001` | `?teaId=g001` |
| Gyokuro | `g002` | `?teaId=g002` |
| Ancient Tree Sheng Pu-erh | `p001` | `?teaId=p001` |
| Silver Needle | `w001` | `?teaId=w001` |

## Testing Your Tags

After writing an NFC tag or generating a QR code, test it with the app to ensure the tea is recognized correctly. If scanning fails, try using a different format or check that the tea ID is correct.
