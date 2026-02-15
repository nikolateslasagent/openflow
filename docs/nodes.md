# Creating Custom Nodes

Nodes are the building blocks of OpenFlow workflows. Each node takes typed inputs, does something, and produces typed outputs.

## Quick Example

```python
from app.nodes.base import BaseNode, StringPort, ImagePort, IntPort, register_node

@register_node
class TextToImage(BaseNode):
    """Generate an image from a text prompt."""

    class Meta:
        id = "image.text_to_image"
        name = "Text to Image"
        description = "Generate an image from a text prompt using any supported model"
        category = "image"
        icon = "🖼️"

    class Inputs:
        prompt = StringPort(description="Text prompt for image generation")
        model = StringPort(default="flux-pro", description="Model identifier")
        width = IntPort(default=1024, description="Output width in pixels")
        height = IntPort(default=1024, description="Output height in pixels")

    class Outputs:
        image = ImagePort(description="Generated image URL")
        seed = IntPort(description="Seed used for generation")

    async def execute(self, inputs, context):
        provider = context.get_provider(inputs["model"])
        result = await provider.generate_image(
            prompt=inputs["prompt"],
            width=inputs["width"],
            height=inputs["height"],
        )
        return {"image": result.url, "seed": result.seed}
```

## Node ID Convention

Use dot-separated ids: `{category}.{name}`

- `image.text_to_image`
- `video.wan_generate`
- `transform.upscale`
- `text.llm_chat`
- `io.file_output`

## Port Types

| Type | Python | Description |
|------|--------|-------------|
| `string` | `StringPort()` | Text values |
| `integer` | `IntPort()` | Whole numbers |
| `float` | `FloatPort()` | Decimal numbers |
| `boolean` | `BoolPort()` | True/False |
| `image` | `ImagePort()` | Image URL or PIL Image |
| `video` | `VideoPort()` | Video URL or file path |
| `audio` | `AudioPort()` | Audio URL or file path |
| `json` | `JsonPort()` | Arbitrary JSON object |
| `any` | Port(port_type=PortType.ANY) | Accepts anything |

## Registration

Use the `@register_node` decorator. The node will automatically appear in the frontend palette under its category.

## File Organization

Place new nodes in the appropriate category folder:

```
server/app/nodes/
├── image/          # Image generation & editing
├── video/          # Video generation
├── text/           # LLM / text processing
├── audio/          # TTS, music, audio processing
├── transform/      # Resize, crop, filter, upscale
└── io/             # File input/output, API calls
```

## Testing Nodes

```python
import pytest
from app.nodes.image.text_to_image import TextToImage
from app.nodes.base import ExecutionContext

@pytest.mark.asyncio
async def test_text_to_image():
    node = TextToImage()
    ctx = ExecutionContext(providers={"flux": MockProvider()})
    result = await node.execute(
        {"prompt": "a cat", "model": "flux-pro", "width": 512, "height": 512},
        ctx,
    )
    assert "image" in result
    assert "seed" in result
```
