
/* ToDo:
  - mobile support
  - Question mark icon next to Api key with link to where to get it + explanation that you can
    delete your key after using it if they don't trust me, or just use my source code directly via Github
  - Add penalty field and maybe other settings
  - Deploy somewhere. Also put in github with instructions to simply put files
    into directory and click the html to run this. Also include instructions
  - AI model switching support
  - For the "Story" section, I'm thinking we can add some annotation tools, like the paragraph 
    IDs GPT mentioned and the annotation request for each marked paragraph. Maybe some color highlight 
    or paragraph annotation to indicate the newly generated story text
  - GPT gave idea to write logic that says if current story/memory is past certain token
    limit, then pass it to some logic that truncates it somehow.. would have to call another
    API to do this and would have to make sure there's no race conditions. 
  - Decide how I want to handle the truncated results. I can have it replace the main story,
    but that might be bad if I hate the truncated results and it removes my story. 
  - I can have it simply truncated and use the results hidden in the background but keep the story as is,
    but then I'd have to call the truncate API each time and I don't know what the truncated result is. 
      - Or I can put truncated results in another tab.. maybe in UI, I can switch between memory tab and 
        truncated results tab. If doing this, make sure truncate logic checks first for this truncated
        result
  - Support to call API 2-5 times and display generated results on separate tabs.
      - Maybe even further support to help mix/match these multiple generated results
      - Maybe support to call different AI models and mix/match their results.
*/

const app = new Vue({
  el: "#app",
  data: {
    apiKey: "",
    story: "",
    prompt: "",
    generatedStory: "",
    loading: false,
    guidelines: "",
    temperature: 0.8,
    frequency_penalty: 0.25,
    maxTokens: 2000,
    prePrompt: "new",
    customPrePrompt: "",
    storyGenerated: false
  },
  computed: {
    storyTokenCount() {
      return this.story.trim().split(/\s+/).length;
    },
  },
  methods: {
    handlePrePromptChange() {
      if (this.prePrompt === "new") {
        this.story = "";
        this.storyGenerated = false;
      }
    },
    async generateStory() {
      if (!this.apiKey || !this.prompt) {
        alert("Please enter your API key and a prompt.");
        return;
      }

      localStorage.setItem("apiKey", this.apiKey);

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      };

      let prePromptText;
      if (this.prePrompt === 'new') {
        prePromptText = "As an AI language model, you are to write an elaborate, well-written, and engaging novel based on the given prompts. Use vivid descriptions, avoid overused expressions, and refrain from using the exact word choices provided in the prompts. Include meaningful dialogues between characters, making sure to use quotation marks and a natural-sounding conversation. Prompt:";
      } else if (this.prePrompt === 'continue') {
        prePromptText = "As an AI language model, you are to help continue writing an elaborate, well-written, and engaging novel. Use vivid descriptions, avoid overused expressions, and refrain from using the exact word choices provided in the prompts. Include meaningful dialogues between characters, making sure to use quotation marks and a natural-sounding conversation. Here is the story so far:";
      } else if (this.prePrompt === 'custom') {
        prePromptText = this.customPrePrompt;
      } else {
        prePromptText = "";
      }

      if (this.prePrompt === 'continue' && !this.prompt.includes('Write out the next part, following this prompt: ')) {
        this.prompt = 'Write out the next part, following this prompt: ' + this.prompt;
      }

      const data = {
        prompt: `${prePromptText}\n${this.story}\n${this.prompt}\n${this.guidelines}`,
        max_tokens: parseInt(this.maxTokens, 10),
        temperature: parseFloat(this.temperature),
        model: 'text-davinci-003',
        frequency_penalty: parseFloat(this.frequency_penalty),
        presence_penalty: 0,
        top_p: 1
      };

      this.loading = true;

      try {
        const response = await axios.post("https://api.openai.com/v1/completions", data, { headers });
        const generatedText = response.data.choices[0].text.replace(/^\n\n/, '');
        this.story += generatedText; //process & display generated text
        this.storyGenerated = true;
      } catch (error) {
        console.error(error);
        alert("An error occurred while generating the story.");
      } finally {
        this.loading = false;
        localStorage.setItem("story", this.story);
        localStorage.setItem("prompt", this.prompt);
        localStorage.setItem("guidelines", this.guidelines);
        localStorage.setItem("temperature", this.temperature);
        localStorage.setItem("maxTokens", this.maxTokens);
        localStorage.setItem("prePrompt", this.prePrompt);
        localStorage.setItem("customPrePrompt", this.customPrePrompt);
      }
    },
  },
  mounted() {
    this.apiKey = localStorage.getItem("apiKey") || "";
    this.story = (localStorage.getItem("prePrompt") === "new") ? "" : (localStorage.getItem("story") || "");
    this.prompt = localStorage.getItem("prompt") || "";
    this.guidelines = localStorage.getItem("guidelines") || "";
    this.temperature = localStorage.getItem("temperature") || 0.8;
    this.maxTokens = localStorage.getItem("maxTokens") || 2000;
    this.prePrompt = localStorage.getItem("prePrompt") || "new";
    this.customPrePrompt = localStorage.getItem("customPrePrompt") || "";

    //Dismisses keyboard on mobile when tapped outside
    document.body.addEventListener("click", function (event) {
      if (!event.target.matches("input, textarea, select")) {
        document.activeElement.blur();
      }
    });    
  },
});
